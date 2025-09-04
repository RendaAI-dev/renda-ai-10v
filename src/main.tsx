
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Service Worker registration com tratamento robusto de erros
const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      // Aguardar carregamento completo da página
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(null);
        } else {
          window.addEventListener('load', resolve);
        }
      });

      // Registrar service worker com verificação de MIME type
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'module'
      });

      console.log('✅ Service Worker registrado com sucesso:', registration.scope);

      // Configurar listeners para atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nova versão disponível. Considere atualizar.');
              // Opcional: mostrar notificação ao usuário
              if (confirm('Nova versão disponível. Atualizar agora?')) {
                window.location.reload();
              }
            }
          });
        }
      });

    } else {
      console.log('ℹ️ Service Worker não suportado neste navegador');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao registrar Service Worker:', error);
    // Não quebrar a aplicação se o SW falhar
  }
};

// Inicializar aplicação
const initializeApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Elemento root não encontrado');
  }

  // Renderizar app
  const root = createRoot(rootElement);
  root.render(<App />);

  // Registrar service worker após renderização
  registerServiceWorker();
};

// Verificar se DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
