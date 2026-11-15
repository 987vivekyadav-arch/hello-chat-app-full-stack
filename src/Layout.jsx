import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./Layout.css";

function Layout() {
    return (
        <div className="layout-page">

            <div className="layout-content">
                <Outlet />
            </div>

            <div className="layout-bottom-bar">

                <Link className="layout-link" to="/home">
                    <span className="layout-icon">◉</span>
                    <span className="layout-label">Chats</span>
                </Link>

                <Link className="layout-link" to="/updates">
                    <span className="layout-icon">◌</span>
                    <span className="layout-label">Updates</span>
                </Link>

                <Link className="layout-link" to="/home">
                    <span className="layout-icon">♧</span>
                    <span className="layout-label">Communities</span>
                </Link>

                <Link className="layout-link" to="/calls">
                    <span className="layout-icon">☎</span>
                    <span className="layout-label">Calls</span>
                </Link>

            </div>
        </div>
    );
}

export default Layout;