import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link as MuiLink, Box, SxProps, Theme, Tooltip } from "@mui/material";
import { useTheme } from "../context/ThemeContext";

interface AccessibleLinkProps {
  href: string;
  children: React.ReactNode;
  isExternal?: boolean;
  isRouterLink?: boolean;
  sx?: SxProps<Theme>;
  ariaLabel?: string;
  tooltip?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  openInNewTab?: boolean;
}

/**
 * An accessible link component that can be used for both internal routing and external links.
 * Includes proper ARIA attributes and keyboard navigation support.
 */
const AccessibleLink: React.FC<AccessibleLinkProps> = ({
  href,
  children,
  isExternal = false,
  isRouterLink = false,
  sx = {},
  ariaLabel,
  tooltip,
  className = "",
  onClick,
  openInNewTab = false,
}) => {
  const { colors, accessibility } = useTheme();

  const linkContent = (
    <>
      {children}
      {isExternal && (
        <Box
          component="span"
          sx={{ 
            ml: 0.5, 
            fontSize: "0.8em", 
            display: "inline-flex", 
            alignItems: "center" 
          }}
          aria-hidden="true"
        >
          <i className="ri-external-link-line" />
        </Box>
      )}
    </>
  );

  // Common props for all link types
  const commonProps = {
    "aria-label": ariaLabel,
    className,
    onClick,
    style: { 
      textDecoration: "none",
      color: accessibility.highContrast ? "inherit" : colors.primary,
      fontWeight: "medium",
      ...(accessibility.largeText && { fontSize: "1.1em" }),
      ...(accessibility.highContrast && { 
        textDecoration: "underline",
        fontWeight: "bold" 
      }),
    },
    sx: {
      "&:hover": {
        textDecoration: "underline",
      },
      "&:focus": {
        outline: accessibility.highContrast ? 
          `2px solid ${colors.primary}` : 
          `1px solid ${colors.primary}`,
        outlineOffset: 2,
        textDecoration: "underline",
      },
      ...sx,
    }
  };

  // External link specific attributes
  const externalLinkProps = isExternal || openInNewTab ? {
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": ariaLabel || `${children} (opens in a new tab)`,
  } : {};

  // Create the appropriate link component
  const renderLink = () => {
    if (isRouterLink) {
      return (
        <RouterLink to={href} {...commonProps}>
          {linkContent}
        </RouterLink>
      );
    } else {
      return (
        <MuiLink href={href} {...commonProps} {...externalLinkProps}>
          {linkContent}
        </MuiLink>
      );
    }
  };

  // Add tooltip if specified
  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {renderLink()}
      </Tooltip>
    );
  }

  return renderLink();
};

export default AccessibleLink;