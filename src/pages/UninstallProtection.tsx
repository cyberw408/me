import React from "react";
import axios from "axios";
import { Container, Typography, Button } from "@mui/material";

const UninstallProtection = () => {
  const enableProtection = () => {
    axios.post("/api/tracker/uninstall-protection/")
      .then(() => alert("Uninstall protection enabled"))
      .catch(error => alert("Failed to enable protection: " + error.response.data.error));
  };

  return (
    <Container>
      <Typography variant="h4">Uninstall Protection</Typography>
      <Button variant="contained" color="primary" onClick={enableProtection}>Enable Uninstall Protection</Button>
    </Container>
  );
};

export default UninstallProtection;
