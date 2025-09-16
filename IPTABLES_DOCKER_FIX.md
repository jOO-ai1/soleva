# Docker iptables SKIP DNAT Rule Fix

This guide addresses the Docker network creation error: "failed to create network soleva_solevaeg-network: Unable to enable SKIP DNAT rule (iptables: No chain/target/match by that name)."

## ✅ Problem Fixed

**Issue**: Docker was unable to create networks due to iptables SKIP DNAT rule conflicts and subnet overlaps.

**Root Causes**:
1. **iptables chain conflicts**: Docker couldn't create required iptables chains
2. **Subnet overlaps**: Multiple networks trying to use the same IP ranges
3. **Leftover network configurations**: Partially created networks causing conflicts

**Solution**: Cleaned up Docker resources, updated network configuration, and used a non-conflicting subnet.

## 🔧 Changes Made

### 1. **Updated docker-compose.yml Network Configuration**
```yaml
networks:
  solevaeg-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"
      com.docker.network.bridge.host_binding_ipv4: "0.0.0.0"
    ipam:
      driver: default
      config:
        - subnet: 172.22.0.0/16
          gateway: 172.22.0.1
```

### 2. **Enhanced Docker Daemon Configuration (daemon.json)**
```json
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"],
  "dns-opts": ["ndots:1", "timeout:3", "attempts:3"],
  "dns-search": [],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "iptables": true,
  "ip-forward": true,
  "ip-masq": true,
  "bridge": "docker0",
  "userland-proxy": false,
  "experimental": false,
  "default-address-pools": [
    {
      "base": "172.17.0.0/12",
      "size": 16
    }
  ]
}
```

### 3. **Created Network Troubleshooting Scripts**
- `fix-docker-network-simple.sh`: Simple network fix without sudo requirements
- `fix-iptables-docker.sh`: Comprehensive iptables fix (requires sudo)

## 🚀 How to Use

### **Option 1: Simple Fix (Recommended)**
```bash
# Run the simple network fix script
./fix-docker-network-simple.sh

# Or run specific operations
./fix-docker-network-simple.sh cleanup    # Clean up Docker resources
./fix-docker-network-simple.sh test       # Test network creation
./fix-docker-network-simple.sh create     # Create solevaeg network
./fix-docker-network-simple.sh verify     # Verify network configuration
```

### **Option 2: Manual Cleanup and Network Creation**
```bash
# Clean up Docker resources
docker-compose down --remove-orphans
docker container prune -f
docker network prune -f

# Remove any existing solevaeg networks
docker network rm solevaeg-network 2>/dev/null || true
docker network rm web_solevaeg-network 2>/dev/null || true

# Test docker-compose network creation
docker-compose up --no-start
```

### **Option 3: Comprehensive iptables Fix (Requires Sudo)**
```bash
# Run the comprehensive iptables fix
./fix-iptables-docker.sh

# Or with full iptables reset
./fix-iptables-docker.sh reset
```

## 🔍 Network Configuration Details

### **Current Subnet Configuration**
- **Network**: `172.22.0.0/16`
- **Gateway**: `172.22.0.1`
- **Available IPs**: `172.22.0.2` - `172.22.255.254`
- **Total IPs**: 65,534 addresses

### **Subnet History (for reference)**
- **172.16.0.0/16**: Original conflicting subnet
- **172.18.0.0/16**: First attempt (conflicted with existing)
- **172.19.0.0/16**: Second attempt (conflicted with existing)
- **172.20.0.0/16**: Third attempt (conflicted with existing)
- **172.22.0.0/16**: **Current working subnet**

### **Bridge Configuration**
- **Driver**: bridge
- **Inter-container communication**: Enabled
- **IP masquerading**: Enabled
- **Host binding**: 0.0.0.0 (all interfaces)

## 🛠️ Troubleshooting

### **Common Issues and Solutions**

#### 1. **"Unable to enable SKIP DNAT rule"**
```bash
# Solution: Clean up Docker resources and use different subnet
./fix-docker-network-simple.sh
```

#### 2. **"Pool overlaps with other one on this address space"**
```bash
# Solution: Remove existing networks and use different subnet
docker network ls | grep solevaeg
docker network rm <network-name>
# Update docker-compose.yml with different subnet
```

#### 3. **"iptables: No chain/target/match by that name"**
```bash
# Solution: Clean up iptables and restart Docker
./fix-iptables-docker.sh
# Or restart Docker daemon
sudo systemctl restart docker
```

#### 4. **"ContainerConfig" errors**
```bash
# Solution: Clean up containers and images
docker-compose down --remove-orphans
docker system prune -f
```

### **Verification Commands**
```bash
# Check network exists
docker network ls | grep solevaeg

# Inspect network configuration
docker network inspect web_solevaeg-network

# Test network creation
docker-compose up --no-start

# Check iptables rules (requires sudo)
sudo iptables -t nat -L DOCKER
sudo iptables -t filter -L DOCKER
```

## 📋 System Requirements

### **Docker Configuration**
- Docker 20.10+
- Docker Compose 2.0+
- iptables support
- Bridge networking support

### **Network Requirements**
- Available subnet: 172.22.0.0/16
- Gateway access: 172.22.0.1
- DNS resolution: 8.8.8.8, 8.8.4.4, 1.1.1.1, 1.0.0.1

### **Permissions**
- Docker daemon access
- Network creation permissions
- iptables configuration access (for comprehensive fix)

## 🔧 Advanced Configuration

### **Custom Subnet Configuration**
If you need to use a different subnet, update `docker-compose.yml`:
```yaml
ipam:
  config:
    - subnet: 172.23.0.0/16  # Change this
      gateway: 172.23.0.1    # Change this
```

### **Docker Daemon Configuration**
To apply the daemon configuration system-wide:
```bash
sudo cp daemon.json /etc/docker/daemon.json
sudo systemctl restart docker
```

### **Alternative Network Modes**
If bridge networking continues to fail, you can use host networking:
```yaml
services:
  backend:
    network_mode: host
    # Remove networks section
```

## 📞 Support

If you encounter issues:

1. **Run the simple fix script**: `./fix-docker-network-simple.sh`
2. **Check Docker daemon status**: `docker info`
3. **Verify network configuration**: `docker network inspect web_solevaeg-network`
4. **Clean up and retry**: `docker-compose down --remove-orphans && docker-compose up -d`
5. **Check system logs**: `journalctl -u docker.service`
6. **Try different subnet**: Update docker-compose.yml with 172.23.0.0/16 or higher

## ✅ Success Indicators

The iptables fix is successful when:
- ✅ `docker network ls` shows `web_solevaeg-network`
- ✅ `docker network inspect web_solevaeg-network` shows correct subnet (172.22.0.0/16)
- ✅ `docker-compose up --no-start` completes without network errors
- ✅ No "SKIP DNAT rule" or "iptables" errors
- ✅ Services can communicate within the network
- ✅ External access works through exposed ports

## 🎯 Key Improvements

### **Network Configuration**
- **Non-conflicting subnet**: 172.22.0.0/16 (avoids overlaps)
- **Proper gateway**: 172.22.0.1
- **Enhanced IPAM**: Explicit driver and config settings

### **Docker Daemon**
- **iptables support**: Explicitly enabled
- **IP forwarding**: Enabled for routing
- **Userland proxy**: Disabled for better performance
- **Address pools**: Proper subnet allocation

### **Troubleshooting Tools**
- **Simple fix script**: No sudo requirements
- **Comprehensive fix script**: Full iptables cleanup
- **Automated cleanup**: Removes conflicting resources
- **Multiple approaches**: Different solutions for different scenarios
