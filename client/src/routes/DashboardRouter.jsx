import React from "react";
import BaseLayout from "../layouts/BaseLayout";

import StudentDashboard from "../pages/Dashboard/StudentDashboard";
import InstructorDashboard from "../pages/Dashboard/InstructorDashboard";
import AdminDashboard from "../pages/Dashboard/AdminDashboard";
import { getUserFromToken } from "../utils/authToken";
const DashboardRouter = () => {
    const user = getUserFromToken();
    console.log("DashboardRouter user:", user);
    if (!user) return null;

    switch (user.role) {
        case "student":
            return <StudentDashboard />;
        case "instructor":
            return <InstructorDashboard />;
        case "admin":
            return <AdminDashboard />;
        default:
            return (
                <BaseLayout>
                    <h1>403 Forbidden</h1>
                    <p>Your role is not recognized.</p>
                </BaseLayout>
            );
    }
};

export default DashboardRouter;
