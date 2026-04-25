// 📁 LOCATION: app/layout.js
import './globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title:       'रंग तरंग Studio',
  description: 'RangTarang Kids YouTube Channel Studio',
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
