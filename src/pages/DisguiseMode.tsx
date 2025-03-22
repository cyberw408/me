import React from "react";
import axios from "axios";
import { Container, Typography, Button } from "@mui/material";

const DisguiseMode = () => {
  const enableDisguise = () => {
    axios.post("/api/tracker/disguise-mode/")
      .then(() => alert("Disguise mode enabled"))
      .catch(error => alert("Failed to enable disguise mode: " + error.response.data.error));
  };

  return (
    <Container>
      <Typography variant="h4">Disguise Mode</Typography>
      <Button variant="contained" color="primary" onClick={enableDisguise}>Enable Disguise Mode</Button>
    </Container>
  );
};

export default DisguiseMode;
