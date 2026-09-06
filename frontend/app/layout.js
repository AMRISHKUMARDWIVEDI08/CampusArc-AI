import './globals.css';

export const metadata = {
  title: 'CampusArc AI',
  description: 'A campus operations and learning platform built for Arc.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
