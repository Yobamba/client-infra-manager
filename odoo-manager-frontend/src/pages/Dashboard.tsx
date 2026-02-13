import { useAuth } from '../context/useAuth';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      {user ? (
        <p>Welcome back, <strong>{user.email}</strong>! (Role: {user.role})</p>
      ) : (
        <p>Loading user data...</p>
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;