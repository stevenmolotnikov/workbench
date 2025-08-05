"use server";

import { createClient } from "@/lib/supabase/server";
import { ModelsDisplay } from "@/components/ModelsDisplay";
import { WorkspaceList } from "@/components/WorkspaceList";
import { LogoutButton } from "@/components/LogoutButton";
import { redirect } from "next/navigation";

export default async function WorkbenchPage() {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // if (error || !user) {
    //     redirect("/login");
    // }

    

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Workbench</h1>
                        <p className="text-sm text-muted-foreground">
                            {/* Logged in as: {user.email} (ID: {user.id}) */}
                            {JSON.stringify(user)}
                        </p>
                    </div>
                    <LogoutButton />
                </div>
                
                <ModelsDisplay />
                
                {/* <WorkspaceList userId={user.id} /> */}
            </div>
        </>
    );
}