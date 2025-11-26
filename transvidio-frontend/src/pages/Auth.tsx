import { AuthForm } from "@/components/AuthForm";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div 
          key="auth-form" 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative"
        >
          <AuthForm />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

