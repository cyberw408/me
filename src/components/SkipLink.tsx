import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "../context/ThemeContext";

/**
 * Skip navigation link component that appears when tabbed to
 * Allows keyboard users to skip navigation and go directly to main content
 */
const SkipLink: React.FC = () => {
  const { colors, accessibility } = useTheme();

  return (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: "absolute",
        left: "-999px",
        width: "1px",
        height: "1px",
        padding: 2,
        overflow: "hidden",
        backgroundColor: accessibility.highContrast ? "#000" : colors.primary,
        color: "#fff",
        fontWeight: "bold",
        zIndex: 9999,
        borderRadius: "0 0 4px 0",
        "&:focus": {
          left: 0,
          width: "auto",
          height: "auto",
          outline: accessibility.highContrast ? "2px solid #fff" : "none",
        },
        ...(accessibility.largeText && {
          fontSize: "1.2rem",
          padding: 3,
        }),
      }}
      onClick={(e) => {
        // Ensure the link works and focus moves properly
        const target = document.getElementById("main-content");
        if (target) {
          target.focus();
          target.setAttribute("tabindex", "-1");
          // Remove tabindex after focus to avoid interfering with normal tab flow
          setTimeout(() => {
            target.removeAttribute("tabindex");
          }, 1000);
        }
      }}
    >
      Skip to main content
    </Box>
  );
};

export default SkipLink;