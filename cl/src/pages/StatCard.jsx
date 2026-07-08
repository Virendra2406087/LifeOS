import { motion } from "framer-motion";

export default function StatCard({ title, value }) {

  return (

    <motion.div
      className="glass-card small-card"

      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.5 }}

      whileHover={{ scale: 1.05 }}
    >

      <h4>{title}</h4>

      <p>{value}</p>

    </motion.div>

  );
}