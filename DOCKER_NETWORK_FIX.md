# Docker Network Fix Guide

This guide addresses the Docker network creation error: "failed to create network soleva_solevaeg-network: iptables: No chain/target/match by that name."

## ✅ Problem Fixed

**Issue**: Docker was unable to create networks due to iptables/nftables conflicts and subnet overlaps.

**Solution**: Updated Docker configuration and network settings to use compatible subnets and proper iptables configuration.

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
        - subnet: 172.19.0.0/16
          gateway: 172.19.0.1
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
  "default-address-pools": [
    {
      "base": "172.17.0.0/12",
      "size": 16
    }
  ]
}
```

### 3. **Created Network Troubleshooting Script**
- `fix-docker-network.sh`: Comprehensive network troubleshooting and fix script

## 🚀 How to Use

### **Option 1: Use the Troubleshooting Script (Recommended)**
```bash
# Run the complete troubleshooting and fix process
./fix-docker-network.sh

# Or run specific operations
./fix-docker-network.sh cleanup    # Clean up existing networks
./fix-docker-network.sh test       # Test network creation
./fix-docker-network.sh create     # Create solevaeg network manually
./fix-docker-network.sh verify     # Verify network configuration
```

### **Option 2: Manual Network Creation**
```bash
# Remove any existing conflicting networks
docker network rm solevaeg-network 2>/dev/null || true
docker network rm web_solevaeg-network 2>/dev/null || true

# Create the network manually
docker network create \
  --driver bridge \
  --subnet=172.19.0.0/16 \
  --gateway=172.19.0.1 \
  --opt com.docker.network.bridge.enable_icc=true \
  --opt com.docker.network.bridge.enable_ip_masquerade=true \
  --opt com.docker.network.bridge.host_binding_ipv4=0.0.0.0 \
  solevaeg-network
```

### **Option 3: Use Docker Compose**
```bash
# Clean up first
docker-compose down --remove-orphans

# Start services (will create network automatically)
docker-compose up -d
```

## 🔍 Network Configuration Details

### **Subnet Configuration**
- **Network**: `172.19.0.0/16`
- **Gateway**: `172.19.0.1`
- **Available IPs**: `172.19.0.2` - `172.19.255.254`
- **Total IPs**: 65,534 addresses

### **Bridge Configuration**
- **Driver**: bridge
- **Inter-container communication**: Enabled
- **IP masquerading**: Enabled
- **Host binding**: 0.0.0.0 (all interfaces)

### **DNS Configuration**
- **Primary DNS**: 8.8.8.8 (Google)
- **Secondary DNS**: 8.8.4.4 (Google)
- **Tertiary DNS**: 1.1.1.1 (Cloudflare)
- **Quaternary DNS**: 1.0.0.1 (Cloudflare)

## 🛠️ Troubleshooting

### **Common Issues and Solutions**

#### 1. **"Pool overlaps with other one on this address space"**
```bash
# Solution: Clean up existing networks
docker network ls | grep solevaeg
docker network rm <network-name>
```

#### 2. **"iptables: No chain/target/match by that name"**
```bash
# Solution: Restart Docker daemon
sudo systemctl restart docker

# Or apply the daemon.json configuration
sudo cp daemon.json /etc/docker/daemon.json
sudo systemctl restart docker
```

#### 3. **"ContainerConfig" errors**
```bash
# Solution: Clean up containers and images
docker-compose down --remove-orphans
docker system prune -f
```

#### 4. **Network creation fails**
```bash
# Solution: Use the troubleshooting script
./fix-docker-network.sh
```

### **Verification Commands**
```bash
# Check network exists
docker network ls | grep solevaeg

# Inspect network configuration
docker network inspect solevaeg-network

# Test network connectivity
docker run --rm --network solevaeg-network alpine ping -c 3 172.19.0.1
```

## 📋 System Requirements

### **Docker Configuration**
- Docker 20.10+
- Docker Compose 2.0+
- iptables or nftables support
- Bridge networking support

### **Network Requirements**
- Available subnet: 172.19.0.0/16
- Gateway access: 172.19.0.1
- DNS resolution: 8.8.8.8, 8.8.4.4, 1.1.1.1, 1.0.0.1

### **Permissions**
- Docker daemon access
- Network creation permissions
- iptables configuration access (may require sudo)

## 🔧 Advanced Configuration

### **Custom Subnet Configuration**
If you need to use a different subnet, update `docker-compose.yml`:
```yaml
ipam:
  config:
    - subnet: 172.20.0.0/16  # Change this
      gateway: 172.20.0.1    # Change this
```

### **Docker Daemon Configuration**
To apply the daemon configuration system-wide:
```bash
sudo cp daemon.json /etc/docker/daemon.json
sudo systemctl restart docker
```

### **Firewall Configuration**
If using a firewall, ensure these ports are open:
- **Docker bridge**: 172.19.0.0/16
- **Host ports**: 80, 443, 3001, 3002, 5432, 6379

## 📞 Support

If you encounter issues:

1. **Run the troubleshooting script**: `./fix-docker-network.sh`
2. **Check Docker daemon status**: `docker info`
3. **Verify network configuration**: `docker network inspect solevaeg-network`
4. **Clean up and retry**: `docker-compose down --remove-orphans && docker-compose up -d`
5. **Check system logs**: `journalctl -u docker.service`

## ✅ Success Indicators

The network fix is successful when:
- ✅ `docker network ls` shows `solevaeg-network`
- ✅ `docker network inspect solevaeg-network` shows correct subnet
- ✅ `docker-compose up --no-start` completes without network errors
- ✅ Services can communicate within the network
- ✅ External access works through exposed ports
