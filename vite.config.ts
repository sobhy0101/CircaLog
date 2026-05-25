import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Processes all Tailwind utility classes (e.g. bg-violet-500)
    react(),       // Enables React JSX transformation and fast refresh
  ],
  resolve: {
    alias: {
      // Allows clean imports like: import Foo from '@/components/Foo'
      // instead of messy relative paths like: '../../components/Foo'
      '@': path.resolve(__dirname, './src'),
    },
  },
})
