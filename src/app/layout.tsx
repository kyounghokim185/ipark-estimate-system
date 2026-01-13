import "./globals.css";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <head>
                {/* 이 줄을 추가하면 무조건 디자인이 적용됩니다 */}
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>{children}</body>
        </html>
    );
}