import { LangProvider } from './contexts/LangContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import RoutesWrapper from "./components/RoutesWrapper";


export default function App() {
  return (
    <LangProvider>
      <ThemeProvider>
        <FavoritesProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <RoutesWrapper />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </LangProvider>
  );
}
