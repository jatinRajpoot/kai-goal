import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/ClientLayout";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
    title: "Kai Productivity",
    description: "A minimal productivity app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <ToastProvider>
                        <ClientLayout>
                            {children}
                        </ClientLayout>
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
