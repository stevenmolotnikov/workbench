# from __future__ import annotations

# import asyncio
# import sys
# from typing import Optional

# from nnsight.schema.response import ResponseModel
# from nnsight.schema.result import RESULT, ResultModel
# from nnsight.tracing.graph import Graph
# from nnsight.util import NNsightError
# from nnsight.intervention.backends.remote import RemoteBackend
# from anyio.streams.memory import MemoryObjectSendStream

# class CallbackBackend(RemoteBackend):

#     def __init__(self, send_stream: MemoryObjectSendStream, event_loop, *args, **kwargs):
#         self.send_stream = send_stream
#         self.event_loop = event_loop
#         super().__init__(*args, **kwargs)

#     def handle_response(
#         self, response: ResponseModel, graph: Optional[Graph] = None
#     ) -> Optional[RESULT]:
#         """Handles incoming response data.

#         Logs the response object.
#         If the job is completed, retrieve and stream the result from the remote endpoint.
#         Use torch.load to decode and load the `ResultModel` into memory.
#         Use the backend object's .handle_result method to handle the decoded result.

#         Args:
#             response (Any): Json data to concert to `ResponseModel`

#         Raises:
#             Exception: If the job's status is `ResponseModel.JobStatus.ERROR`

#         Returns:
#             ResponseModel: ResponseModel.
#         """
        
#         # Send update to callback url.
#         try:
#             asyncio.run_coroutine_threadsafe(
#                 self.send_stream.send({"type": "status", "message": str(response.status)}),
#                 self.event_loop
#             )
#         except Exception as e:
#             print(f"Failed to send update: {e}")
        
#         if response.status == ResponseModel.JobStatus.ERROR:
#             raise SystemExit(f"{response.description}\nRemote exception.")

#         # If job is completed:
#         if response.status == ResponseModel.JobStatus.COMPLETED:

#             # If the response has no result data, it was too big and we need to stream it from the server.
#             if response.data is None:

#                 result = self.get_result(response.id)
#             else:

#                 result = response.data

#             return result

#         # If were receiving a streamed value:
#         elif response.status == ResponseModel.JobStatus.STREAM:

#             # Second item is index of LocalContext node.
#             # First item is the streamed value from the remote service.

#             index, dependencies = response.data

#             ResultModel.inject(graph, dependencies)

#             node = graph.nodes[index]

#             node.execute()

#         elif response.status == ResponseModel.JobStatus.NNSIGHT_ERROR:
#             if graph.debug:
#                 error_node = graph.nodes[response.data["node_id"]]
#                 try:
#                     raise NNsightError(
#                         response.data["err_message"],
#                         error_node.index,
#                         response.data["traceback"],
#                     )
#                 except NNsightError as nns_err:
#                     print(f"\n{response.data['traceback']}")
#                     print(
#                         "During handling of the above exception, another exception occurred:\n"
#                     )
#                     print(f"{error_node.meta_data['traceback']}")

#                     sys.tracebacklimit = 0
#                     raise nns_err from None
                
#             else:
#                 print(f"\n{response.data['traceback']}")
#                 raise SystemExit("Remote exception.")
    
# def wrapped_trace(self, *args, send_stream: MemoryObjectSendStream, event_loop, remote: bool, **kwargs):
#     backend = None

#     if remote:
#         backend = CallbackBackend(
#             send_stream, event_loop, self.to_model_key(), blocking=True
#         )

#     # Fix bc ndif remote has caching true so block output kv states
#     output_attentions = True

#     return self.trace(*args, backend=backend, output_attentions=output_attentions, **kwargs)


# def wrapped_session(self, *args, send_stream: MemoryObjectSendStream, event_loop, remote: bool, **kwargs):
#     backend = None

#     if remote:
#         backend = CallbackBackend(
#             send_stream, event_loop, self.to_model_key(), blocking=True
#         )

#     return self.session(*args, backend=backend, **kwargs)

