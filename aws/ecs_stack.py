import os
from pathlib import Path
from typing import Dict, List, Optional

from aws_cdk import CfnOutput, RemovalPolicy, Size, Stack, aws_autoscaling
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_iam as iam
from aws_cdk import aws_route53 as route53
from aws_cdk import aws_route53_targets as route53_targets
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3_deployment
from aws_cdk import aws_servicediscovery
from constructs import Construct
from schema import (
    ContainerSchema,
    EnvironmentSchema,
    PortMappingSchema,
    ServiceSchema,
    VolumeSchema,
)

# Define the directory containing configuration files
# CONFIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")


class NDIFEcsStack(Stack):
    """
    AWS CDK Stack for deploying NDIF services on Amazon ECS.

    This stack creates the necessary infrastructure for running containerized applications
    on EC2 instances within an ECS cluster, including networking, security, and service discovery.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: EnvironmentSchema,
        ssh_key_name: Optional[str] = None,
        **kwargs,
    ) -> None:
        """
        Initialize the NDIF ECS Stack.

        Args:
            scope: The parent construct.
            construct_id: The ID of this construct (will be used as stack name).
            environment: Schema containing environment configuration.
            ssh_key_name: Optional name of SSH key for EC2 instance access.
            **kwargs: Additional arguments to pass to the parent Stack.
        """
        # Add stack name tag to help identify different deployments
        if "tags" not in kwargs:
            kwargs["tags"] = {}
        kwargs["tags"]["Environment"] = environment.name

        super().__init__(scope, construct_id, **kwargs)

        # Store environment name and SSH key name for later use
        self.name = environment.name
        self.ssh_key_name = ssh_key_name

        # # Create S3 bucket for configuration files
        # self.config_bucket = self.add_config_bucket()

        # # Create S3 bucket for results
        # self.results_bucket = self.add_results_bucket()

        # Create infrastructure role for EBS volumes
        # This role allows ECS to manage EBS volumes for containers
        self.ecs_infrastructure_role = iam.Role(
            self,
            f"{self.name}EcsInfrastructureRole",
            assumed_by=iam.ServicePrincipal("ecs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSInfrastructureRolePolicyForVolumes"
                )
            ],
        )

        # Create instance role for EC2 instances that will run ECS tasks
        # This role allows EC2 instances to register with ECS and pull container images
        self.ecs_instance_role = iam.Role(
            self,
            f"{self.name}EcsInstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonEC2ContainerServiceforEC2Role"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                ),
                # Add ECR read access policy
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonEC2ContainerRegistryReadOnly"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonS3FullAccess"  # Change from ReadOnly to FullAccess
                ),
            ],
        )

        # # Grant read access to the config bucket
        # self.config_bucket.grant_read_write(
        #     self.ecs_instance_role
        # )  # Grant both read and write access

        # # Grant read/write access to the results bucket
        # self.results_bucket.grant_read_write(self.ecs_instance_role)

        # Create VPC with public and private subnets
        # Public subnets for instances that need direct internet access
        # Private subnets for internal resources with outbound internet access via NAT
        self.vpc = ec2.Vpc(
            self,
            f"{self.name}VPC",
            max_azs=2,  # Use 2 Availability Zones for high availability
            nat_gateways=1,  # Single NAT gateway to reduce costs
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        self.security_group = self.add_security_group()

        self.nlb = self.add_network_load_balancer()

        # Create private DNS namespace for service discovery
        # This allows services to find each other using DNS names
        self.namespace = aws_servicediscovery.PrivateDnsNamespace(
            self, f"{self.name}Namespace", name="service.local", vpc=self.vpc
        )

        # Create ECS cluster to manage container instances
        self.cluster = ecs.Cluster(
            self,
            f"{self.name}Cluster",
            vpc=self.vpc,
            cluster_name=self.name,  # Use environment name as cluster name
        )

        # Create a fake capacity provider setup
        # This is required for the cluster but we're not using auto-scaling
        # Instead, we'll create individual EC2 instances for each service

        # Create launch template for the fake ASG
        fake_launch_template = ec2.LaunchTemplate(
            self,
            f"{self.name}FakeLaunchTemplate",
            instance_type=ec2.InstanceType("t2.micro"),
            machine_image=ecs.EcsOptimizedImage.amazon_linux2023(),
            role=self.ecs_instance_role,
            user_data=ec2.UserData.for_linux(),
        )

        # Create auto-scaling group with zero capacity
        fake_auto_scaling_group = aws_autoscaling.AutoScalingGroup(
            self,
            f"{self.name}FakeASG",
            vpc=self.vpc,
            launch_template=fake_launch_template,
            min_capacity=0,
            max_capacity=0,
            desired_capacity=0,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Create capacity provider from the ASG
        fake_capacity_provider = ecs.AsgCapacityProvider(
            self,
            f"{self.name}FakeCapacityProvider",
            auto_scaling_group=fake_auto_scaling_group,
        )

        # Add capacity provider to the cluster
        self.cluster.add_asg_capacity_provider(fake_capacity_provider)

        # Create services defined in the environment schema
        for service_schema in environment.services:
            self.add_service(service_schema)

        # Output the cluster name
        # CfnOutput(
        #     self,
        #     "ClusterName",
        #     value=self.cluster.cluster_name,
        #
        # description="Name of the ECS Cluster",
        # )

    # def add_config_bucket(self):
    #     """
    #     Create S3 bucket for configuration files and deploy configs from local directory.

    #     Returns:
    #         The created S3 bucket.
    #     """
    #     # Create S3 bucket for configuration files
    #     bucket_name = f"{self.name.lower()}-ndif-config"

    #     # Create new S3 bucket with removal policy set to DESTROY
    #     config_bucket = s3.Bucket(
    #         self,
    #         f"{self.name}ConfigBucket",
    #         bucket_name=bucket_name,
    #         removal_policy=RemovalPolicy.DESTROY,  # Delete bucket when stack is deleted
    #         auto_delete_objects=True,  # Delete all objects in the bucket when the bucket is deleted
    #     )

    #     # Deploy all files from the config directory to the S3 bucket
    #     s3_deployment.BucketDeployment(
    #         self,
    #         f"{self.name}ConfigDeployment",
    #         sources=[s3_deployment.Source.asset(CONFIG_DIR)],
    #         destination_bucket=config_bucket,
    #         retain_on_delete=False,  # Don't retain the deployment when the stack is deleted
    #     )

    #     # Output the bucket name
    #     CfnOutput(
    #         self,
    #         "ConfigBucketName",
    #         value=config_bucket.bucket_name,
    #         description="Name of the S3 bucket containing configuration files",
    #     )

    #     return config_bucket

    # def add_results_bucket(self):
    #     """
    #     Create S3 bucket for storing results data.

    #     Returns:
    #         The created S3 bucket.
    #     """
    #     # Create S3 bucket for results
    #     bucket_name = f"{self.name.lower()}-ndif-results"

    #     # Create new S3 bucket with removal policy set to DESTROY
    #     results_bucket = s3.Bucket(
    #         self,
    #         f"{self.name}ResultsBucket",
    #         bucket_name=bucket_name,
    #         removal_policy=RemovalPolicy.DESTROY,  # Delete bucket when stack is deleted
    #         auto_delete_objects=True,  # Delete all objects in the bucket when the bucket is deleted
    #     )

    #     # Output the bucket name
    #     CfnOutput(
    #         self,
    #         "ResultsBucketName",
    #         value=results_bucket.bucket_name,
    #         description="Name of the S3 bucket for storing results data",
    #     )

    #     return results_bucket

    def add_network_load_balancer(self):
        """Create a Network Load Balancer for the services"""
        # Create Network Load Balancer
        nlb = elbv2.NetworkLoadBalancer(
            self,
            f"{self.name}NLB",
            vpc=self.vpc,
            internet_facing=True,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            load_balancer_name=f"{self.name.lower()}-nlb",
        )
        # TODO we need to figure out dev deployments, like test.ndif.dev, etc.
        # Create a Route53 record for the load balancer
        # Look up the existing hosted zone for ndif.dev
        hosted_zone = route53.HostedZone.from_lookup(
            self, f"{self.name}NdifDevZone", domain_name="api.ndif.us"
        )

        # Create an A record that points to the load balancer
        route53.ARecord(
            self,
            f"{self.name}NdifLoadBalancerRecord",
            zone=hosted_zone,
            record_name="api.ndif.us",
            delete_existing=True,
            target=route53.RecordTarget.from_alias(
                route53_targets.LoadBalancerTarget(nlb)
            ),
        )

        # Output the DNS name
        CfnOutput(
            self,
            f"{self.name}LoadBalancerDnsName",
            value="api.ndif.us",
            description="DNS name for accessing the load balancer",
        )

        return nlb

    def add_security_group(self):
        # Create security group for ECS instances
        # This controls network access to and from the instances
        security_group = ec2.SecurityGroup(
            self,
            f"{self.name}SecurityGroup",
            vpc=self.vpc,
            description="Security group for an EC2",
            allow_all_outbound=True,  # Allow all outbound traffic
        )

        # Allow SSH access from anywhere (consider restricting in production)
        security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(22), "Allow SSH access"
        )

        # Allow all traffic between services using the same VPC
        security_group.add_ingress_rule(
            ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            ec2.Port.all_traffic(),
            "Allow all traffic between services in the same VPC",
        )

        # For each public subnet (where NLB interfaces will be), allow traffic to the container ports
        for subnet in self.vpc.public_subnets:
            security_group.add_ingress_rule(
                ec2.Peer.ipv4(subnet.ipv4_cidr_block),
                ec2.Port.tcp_range(1024, 65535),
                f"Allow inbound traffic from NLB in subnet {subnet.ipv4_cidr_block}",
            )

        return security_group

    def add_instance(self, name: str, service_schema: ServiceSchema) -> ec2.Instance:
        """
        Create an EC2 instance for running ECS tasks.

        Args:
            name: Name prefix for the instance.
            service_schema: Service configuration schema.

        Returns:
            The created EC2 instance.
        """
        # Create user data script to configure the instance for ECS
        user_data = ec2.UserData.for_linux()

        # Configure ECS agent to join our cluster and add custom attributes
        # These attributes are used for task placement constraints
        user_data.add_commands(
            f"echo ECS_CLUSTER={self.cluster.cluster_name} >> /etc/ecs/ecs.config",
            f'echo \'ECS_INSTANCE_ATTRIBUTES={{"Service":"{name}"}}\' >> /etc/ecs/ecs.config',
            "echo 'ECS_ENABLE_TASK_IAM_ROLE=true' >> /etc/ecs/ecs.config",
            "echo 'ECS_ENABLE_CONTAINER_DEPENDENCY_MANAGEMENT=true' >> /etc/ecs/ecs.config",
            "echo 'GatewayPorts yes' >> /etc/ssh/sshd_config",
            "systemctl restart sshd",
        )

        instance_type = ec2.InstanceType(service_schema.instance_type)
        hardware_type = (
            ecs.AmiHardwareType.STANDARD
            if instance_type.architecture == ec2.InstanceArchitecture.X86_64
            else ecs.AmiHardwareType.ARM
        )

        # Create EC2 instance with ECS-optimized AMI
        instance = ec2.Instance(
            self,
            f"{name}Instance",
            instance_type=instance_type,
            machine_image=ecs.EcsOptimizedImage.amazon_linux2023(
                hardware_type=hardware_type
            ),
            vpc=self.vpc,
            security_group=self.security_group,
            key_name=self.ssh_key_name,  # SSH key for direct access if needed
            associate_public_ip_address=True,  # Public IP for internet access
            role=self.ecs_instance_role,
            user_data=user_data,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Output the instance's public IP address
        CfnOutput(
            self,
            f"{name}InstancePublicIP",
            value=instance.instance_public_ip,
            description=f"Public IP address of the {name} instance",
        )

        return instance

    def add_service(self, service_schema: ServiceSchema):
        """
        Add a service to the ECS cluster.

        Args:
            service_schema: Service configuration schema.
        """
        # Create a unique name for the service using environment name prefix
        name = f"{self.name}{service_schema.name}"

        # Create task definition with AWS VPC networking mode
        # This allows tasks to use the VPC network directly
        task = ecs.Ec2TaskDefinition(
            self,
            f"{name}TaskDefinition",
            network_mode=ecs.NetworkMode.AWS_VPC,
        )

        # Create dedicated EC2 instance for this service
        instance = self.add_instance(name, service_schema)

        # Create ECS service to run the task
        service = ecs.Ec2Service(
            self,
            f"{name}Service",
            service_name=service_schema.name,
            cluster=self.cluster,
            task_definition=task,
            desired_count=1,  # Run one copy of the task
            # If you want non-rolling updates, uncomment these
            # max_healthy_percent=100,
            # min_healthy_percent=0,
            security_groups=[self.security_group],
            # Ensure tasks run only on the dedicated instance for this service
            placement_constraints=[
                ecs.PlacementConstraint.member_of(f"attribute:Service == {name}")
            ],
            # Register service in the service discovery namespace
            cloud_map_options=ecs.CloudMapOptions(
                cloud_map_namespace=self.namespace, name=service_schema.name
            ),
        )

        # Output the service name
        CfnOutput(
            self,
            f"{name}ServiceName",
            value=service.service_name,
            description=f"Name of the ECS Service for {service_schema.name}",
        )

        # Add containers defined in the service schema
        for container in service_schema.containers:
            self.add_container(name, task, service, instance, container)

    def add_container(
        self,
        name: str,
        task: ecs.Ec2TaskDefinition,
        service: ecs.Ec2Service,
        instance: ec2.Instance,
        container_schema: ContainerSchema,
    ):
        """
        Add a container to a task definition.

        Args:
            name: Name prefix for the container.
            task: The task definition to add the container to.
            instance: The EC2 instance that will run the container.
            container_schema: Container configuration schema.
        """
        # Create a unique name for the container
        name = f"{name}{container_schema.name}"

        # Create a copy of environment variables and add EC2 instance IPs
        env_vars = container_schema.environment_variables.copy()

        # Process env vars to replace ${EC2_PRIVATE_IP} and ${EC2_PUBLIC_IP} with actual values
        for key, value in env_vars.items():
            if isinstance(value, str):
                env_vars[key] = value.replace(
                    "${EC2_PRIVATE_IP}", instance.instance_private_ip
                )
                env_vars[key] = env_vars[key].replace(
                    "${EC2_PUBLIC_IP}", instance.instance_public_ip
                )

        container = task.add_container(
            f"{name}Container",
            image=ecs.ContainerImage.from_registry(container_schema.repo_id),
            memory_reservation_mib=256,
            environment=env_vars,
            command=container_schema.command,
        )

        # Add port mappings to expose container ports
        for port_mapping in container_schema.port_mappings:
            container.add_port_mappings(
                ecs.PortMapping(
                    container_port=port_mapping.container_port,
                    host_port=port_mapping.host_port,
                )
            )

            if port_mapping.public:
                self.add_nlb_routing(name, service, port_mapping, container)

        # # Add volumes defined in the container schema
        # for i, volume_schema in enumerate(container_schema.volumes):
        #     self.add_volume(f"{name}-{i}", container, instance, volume_schema)

        # # Add commands to download config files from S3
        # if container_schema.configs:

        #     # Now process each config
        #     for config in container_schema.configs:
        #         # Create parent directory if it doesn't exist
        #         parent_dir = os.path.dirname(config.host_path)
        #         instance.user_data.add_commands(
        #             f"echo 'Creating directory {parent_dir}'",
        #             f"mkdir -p {parent_dir}",
        #             f"echo 'Copying file from s3://{self.config_bucket.bucket_name}/{config.bucket_path} to {config.host_path}'",
        #             f"aws s3 cp s3://{self.config_bucket.bucket_name}/{config.bucket_path} {config.host_path} || (",
        #             "    echo 'Failed to copy file from S3, retrying in 10 seconds...'",
        #             "    sleep 10",
        #             f"    aws s3 cp s3://{self.config_bucket.bucket_name}/{config.bucket_path} {config.host_path}",
        #             ")",
        #             f"echo 'Setting permissions for {config.host_path}'",
        #             f"chmod -R 777 {config.host_path}",
        #         )

    def add_volume(
        self,
        name: str,
        container: ecs.ContainerDefinition,
        instance: ec2.Instance,
        volume_schema: VolumeSchema,
    ):
        """
        Add an EBS volume to an EC2 instance and mount it in a container.

        Args:
            name: Name prefix for the volume.
            container: The container definition to mount the volume in.
            instance: The EC2 instance to attach the volume to.
            volume_schema: Volume configuration schema.
        """
        # Create a unique name for the volume
        name = f"{name}{volume_schema.name}Volume"

        # Add volume to the task definition
        container.task_definition.add_volume(
            name=name, host=ecs.Host(source_path=volume_schema.host_path)
        )

        # Mount the volume in the container
        container.add_mount_points(
            ecs.MountPoint(
                source_volume=name,
                container_path=volume_schema.container_path,
                read_only=False,
            )
        )
        
        if volume_schema.size > 0:
            
            # Create EBS volume in the same AZ as the instance
            volume = ec2.Volume(
                self,
                name,
                availability_zone=instance.instance_availability_zone,
                size=Size.gibibytes(volume_schema.size),
                encrypted=False,
                removal_policy=RemovalPolicy.DESTROY,
                volume_type=getattr(ec2.EbsDeviceVolumeType, volume_schema.type),
            )

            # Attach the EBS volume to the EC2 instance
            ec2.CfnVolumeAttachment(
                self,
                f"{name}{volume_schema.name}VolumeAttachment",
                instance_id=instance.instance_id,
                volume_id=volume.volume_id,
                device=volume_schema.mount_path,  # Device path on the instance
            )
            

            # Add commands to the instance user data to prepare the volume
            instance.user_data.add_commands(
                # Create mount point directory
                f"mkdir -p {volume_schema.host_path}",
                # Wait for the EBS volume to be attached and device to appear
                f"while [ ! -e {volume_schema.mount_path} ]; do echo 'Waiting for {volume_schema.mount_path} to be available...'; sleep 5; done",
                # Check if the device needs to be formatted
                f"if ! blkid {volume_schema.mount_path}; then",
                f"    echo 'Formatting {volume_schema.mount_path}'",
                f"    mkfs -t ext4 {volume_schema.mount_path}",
                "fi",
                # Attempt to mount the volume
                f"mount {volume_schema.mount_path} {volume_schema.host_path} || (",
                f"    echo 'Failed to mount {volume_schema.mount_path}, retrying...'",
                f"    sleep 10",
                f"    mount {volume_schema.mount_path} {volume_schema.host_path}",
                ")",
                # Set permissions and add to fstab
                f"rm -rf {volume_schema.host_path}/lost+found",
                f"chmod 777 {volume_schema.host_path}",
                f"echo '{volume_schema.mount_path} {volume_schema.host_path} ext4 defaults 0 2' >> /etc/fstab",
            )

    def add_nlb_routing(
        self,
        name: str,
        service: ecs.Ec2Service,
        port_mapping: PortMappingSchema,
        container: ecs.ContainerDefinition,
    ):
        """
        Add NLB routing for a specific port on an instance.

        Args:
            name: Name of the service.
            port_mapping: Port mapping schema with public_path information.
            container: The container definition to route traffic to.
        """

        name = f"{name}{port_mapping.host_port}"

        # Create a target group for this service
        target_group = elbv2.NetworkTargetGroup(
            self,
            f"{name}TG",
            vpc=self.vpc,
            port=port_mapping.host_port,
            protocol=elbv2.Protocol.TCP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                port=str(port_mapping.host_port),
                protocol=elbv2.Protocol.TCP,
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
        )

        # Attach only this specific container to the target group
        target_group.add_target(
            service.load_balancer_target(
                container_name=container.container_name,
                container_port=port_mapping.container_port,
            )
        )

        # Create a dedicated listener for this port
        listener = self.nlb.add_listener(
            f"{name}Listener",
            port=port_mapping.host_port,
            protocol=elbv2.Protocol.TCP,
            default_action=elbv2.NetworkListenerAction.forward([target_group]),
        )

        # Output the URL for this service
        CfnOutput(
            self,
            f"{name}Output",
            value=f"http://{self.nlb.load_balancer_dns_name}:{port_mapping.host_port}",
            description=f"URL for {name}",
        )