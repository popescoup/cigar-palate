// src/app/register/page.tsx
import Register from '../components/Register';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <Register />
      </div>
    </div>
  );
};

export default RegisterPage;