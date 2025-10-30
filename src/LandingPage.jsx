import { Link } from "react-router-dom";
import { FaFacebook, FaEnvelope, FaPhone } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 🔝 Navbar */}
      <nav className="w-full bg-gray-900 border-b border-gray-800 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl md:text-3xl font-extrabold text-yellow-400">
          Ghetto Riders
        </h1>

        {/* Hamburger for mobile */}
        <input id="menu-toggle" type="checkbox" className="hidden peer" />
        <label
          htmlFor="menu-toggle"
          className="md:hidden flex flex-col gap-1 cursor-pointer"
        >
          <span className="w-6 h-0.5 bg-yellow-400"></span>
          <span className="w-6 h-0.5 bg-yellow-400"></span>
          <span className="w-6 h-0.5 bg-yellow-400"></span>
        </label>

        {/* Links */}
        <ul className="hidden md:flex gap-8 text-gray-300">
          <li>
            <a href="#home" className="hover:text-yellow-400 transition">
              Home
            </a>
          </li>
          <li>
            <a href="#about" className="hover:text-yellow-400 transition">
              About
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:text-yellow-400 transition">
              Contact
            </a>
          </li>
          <li>
            <Link
              to="/book"
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              Book Now
            </Link>
          </li>
        </ul>

        {/* Mobile menu */}
        <ul className="peer-checked:flex hidden absolute top-16 right-6 bg-gray-900 border border-gray-700 rounded-lg flex-col items-start p-4 gap-4 md:hidden shadow-lg">
          <li>
            <a href="#home" className="hover:text-yellow-400 transition">
              Home
            </a>
          </li>
          <li>
            <a href="#about" className="hover:text-yellow-400 transition">
              About
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:text-yellow-400 transition">
              Contact
            </a>
          </li>
          <li>
            <Link
              to="/book"
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              Book Now
            </Link>
          </li>
        </ul>
      </nav>

      {/* 🏁 Hero Section */}
      <section
        id="home"
        className="flex flex-col items-center justify-center flex-1 px-6 text-center py-20 md:py-32"
      >
        {/* 🚲 Added Circular Image */}
        <img
          src="/main-picture.jpg"  // <-- Put your image inside the public/ folder
          alt="Ghetto Riders"
          className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover mb-6 border-4 border-yellow-400 shadow-lg"
        />

        <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-yellow-400">
          Ride the Streets, Ghetto Style
        </h2>
        <p className="text-gray-300 text-lg md:text-xl max-w-xl mb-8">
          Fast, reliable, and affordable motorcycle rides — anytime, anywhere.
          Book your next trip and feel the wind with Ghetto Riders.
        </p>
        <Link
          to="/book"
          className="bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-all shadow-lg"
        >
          Book a Ride
        </Link>
      </section>

      {/* 🏍️ About Section */}
      <section
        id="about"
        className="bg-gray-900 py-16 px-6 md:px-12 text-center"
      >
        <h3 className="text-3xl font-bold text-yellow-400 mb-4">About Us</h3>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Ghetto Riders is your go-to motorcycle booking service that connects
          riders and passengers seamlessly. Whether you’re commuting to work,
          visiting friends, or exploring the city, we guarantee safe, fast, and
          budget-friendly rides.
        </p>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Our professional riders are trained and equipped to ensure your
          comfort and security. With our app, you can easily track your ride,
          estimate your fare, and get where you need to go — hassle-free.
        </p>
      </section>

      {/* 📞 Contact Section */}
      <section
        id="contact"
        className="bg-gray-950 py-16 px-6 md:px-12 text-center border-t border-gray-800"
      >
        <h3 className="text-3xl font-bold text-yellow-400 mb-6">Contact Us</h3>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-gray-300">
          <div className="flex items-center gap-3">
            <FaFacebook className="text-yellow-400 text-2xl" />
            <a
              href="https://www.facebook.com/profile.php?id=61582462506784"
              target="_blank"
              rel="noreferrer"
              className="hover:text-yellow-400"
            >
              facebook.com/ghettoriders
            </a>
          </div>

          <div className="flex items-center gap-3">
            <FaEnvelope className="text-yellow-400 text-2xl" />
            <a
              href="mailto:ghettoriders@gmail.com"
              className="hover:text-yellow-400"
            >
              ghettoriders@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-3">
            <FaPhone className="text-yellow-400 text-2xl" />
            <a href="tel:+639123456789" className="hover:text-yellow-400">
              +63 912 345 6789
            </a>
          </div>
        </div>
      </section>

      {/* ⚫ Footer */}
      <footer className="bg-gray-900 py-4 text-center text-gray-500 text-sm border-t border-gray-800">
        © {new Date().getFullYear()} Ghetto Riders. All rights reserved.
      </footer>
    </div>
  );
}
