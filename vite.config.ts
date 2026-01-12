import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto permite que se acceda desde la red local (tu celular)
    port: 5173, // Mantiene el puerto estándar
  }
})