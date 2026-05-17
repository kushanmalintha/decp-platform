import { useAuth } from "../../auth/useAuth";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <section className="page">
      <h1>Dashboard</h1>
      <p>Welcome{user?.email ? `, ${user.email}` : ""}.</p>
    </section>
  );
};

export default Dashboard;
