import React from "react";

interface PageTitleProps {
    children: React.ReactNode;
    className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ children, className }) => (
    <h1 className={`text-3xl font-bold mb-4 ${className ?? ''}`}>{children}</h1>
);

export default PageTitle; 