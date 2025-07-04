
import { Navigate } from "react-router-dom";

const Index = () => {
  console.log('=== INDEX COMPONENT ===');
  console.log('Index component rendering - redirecting to dashboard');
  console.log('=== END INDEX COMPONENT ===');

  // Simply redirect to dashboard - authentication will be handled by ProtectedRoute
  return <Navigate to="/dashboard" replace />;
};

export default Index;
