import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Team from './pages/Team';
import About from './pages/About';
import Booking from './pages/Booking';
import VerifyOtp from './pages/VerifyOtp';
import BookingConfirmation from './pages/BookingConfirmation';
import AdminLogin from './pages/admin/AdminLogin';
import AdminResetPassword from './pages/admin/AdminResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRooms from './pages/admin/AdminRooms';
import AdminBookings from './pages/admin/AdminBookings';
import AdminTeam from './pages/admin/AdminTeam';
import AdminHotelInfo from './pages/admin/AdminHotelInfo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:id" element={<RoomDetail />} />
          <Route path="team" element={<Team />} />
          <Route path="about" element={<About />} />
          <Route path="booking/:roomId" element={<Booking />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
          <Route path="booking-confirmation" element={<BookingConfirmation />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/reset-password" element={<AdminResetPassword />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="hotel-info" element={<AdminHotelInfo />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
