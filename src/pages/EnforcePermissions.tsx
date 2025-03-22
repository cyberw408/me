import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Chip,
  Alert,
} from "@mui/material";

// ✅ Define Device Interface
interface Device {
  device_id: string;
  device_name: string;
}

// ✅ Permissions List
const permissionsList: string[] = [
  "Camera",
  "Location",
  "Microphone",
  "Storage",
  "Contacts",
  "SMS",
  "Call Logs",
  "Notifications",
];

const EnforcePermissions = () => {
  // ✅ Define State with Correct Typings
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = () => {
    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/")
      .then((response) => {
        if (Array.isArray(response.data.devices)) {
          setDevices(response.data.devices);
          if (response.data.devices.length > 0) {
            setSelectedDevice(response.data.devices[0].device_id);
          }
        } else {
          setError("Invalid response format.");
        }
      })
      .catch(() => setError("Error fetching devices."));
  };

  const handleEnforcePermissions = () => {
    if (!selectedDevice) {
      setError("Please select a device.");
      return;
    }
    if (selectedPermissions.length === 0) {
      setError("Please select at least one permission.");
      return;
    }

    setError(null);
    setSuccess(null);

    axios
      .post("/api/tracker/device/enforce-permissions/", {
        device_id: selectedDevice,
        permissions: selectedPermissions,
      })
      .then(() => {
        setSuccess("Permissions enforced successfully!");
      })
      .catch((error) =>
        setError("Failed to enforce permissions: " + (error.response?.data?.error || "Unknown error."))
      );
  };

  return (
    <Container>
      <Typography variant="h4">Enforce Permissions</Typography>

      {error && <Alert severity="error" sx={{ marginTop: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ marginTop: 2 }}>{success}</Alert>}

      {/* Device Selector */}
      <FormControl fullWidth sx={{ marginTop: 2 }}>
        <InputLabel>Select Device</InputLabel>
        <Select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value as string)}
          displayEmpty
        >
          {devices.length > 0 ? (
            devices.map((device: Device) => (
              <MenuItem key={device.device_id} value={device.device_id}>
                {device.device_name} (ID: {device.device_id})
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No devices found</MenuItem>
          )}
        </Select>
      </FormControl>

      {/* Permissions Multi-Select */}
      <FormControl fullWidth sx={{ marginTop: 2 }}>
        <InputLabel>Select Permissions</InputLabel>
        <Select
          multiple
          value={selectedPermissions}
          onChange={(e) => setSelectedPermissions(e.target.value as string[])}
          input={<OutlinedInput label="Select Permissions" />}
          renderValue={(selected) => (
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {selected.map((value) => (
                <Chip key={value} label={value} style={{ margin: 2 }} />
              ))}
            </div>
          )}
        >
          {permissionsList.map((permission) => (
            <MenuItem key={permission} value={permission}>
              {permission}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Enforce Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleEnforcePermissions}
        sx={{ marginTop: 2 }}
      >
        Enforce Permissions
      </Button>
    </Container>
  );
};

export default EnforcePermissions;
