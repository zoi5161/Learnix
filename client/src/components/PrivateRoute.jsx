// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getUserFromToken } from "../utils/authToken";

const PrivateRoute = ({ children }) => {
  const user = getUserFromToken();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default PrivateRoute;
