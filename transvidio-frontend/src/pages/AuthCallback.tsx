import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Simpan token JWT ke localStorage
      localStorage.setItem("access_token", token);

      // Hapus query token dari URL sebelum redirect
      window.history.replaceState({}, "", window.location.pathname);

      // Redirect ke halaman utama / dashboard
      navigate("/", { replace: true });
    } else {
      // Jika tidak ada token, arahkan ke halaman login
      navigate("/login", { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative inline-block w-16 h-16">
        <span className="absolute inline-block w-full h-full rounded-full bg-primary opacity-75 animate-ping"></span>
        <span className="relative inline-block w-full h-full rounded-full bg-primary"></span>
      </div>
    </div>
  );
}
