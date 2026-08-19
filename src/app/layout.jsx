import "./globals.css";

export const metadata = {
  title: "Admin Panel",
  description: "სისტემის ადმინისტრირების პანელი",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}