import React from 'react';
import PublicNavbar from '../components/PublicNavbar';
import './BaseLayout.css';

interface BaseLayoutProps {
    children: React.ReactNode;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
    return (
        <div className="base-layout">
            <PublicNavbar />
            <main className="base-layout-main">
                <div className="base-layout-content">{children}</div>
            </main>
            <footer className="base-layout-footer">
                <p>© 2025 Learnix | Nền tảng học lập trình hàng đầu Việt Nam</p>
            </footer>
        </div>
    );
};

export default BaseLayout;
