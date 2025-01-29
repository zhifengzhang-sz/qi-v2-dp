# Operation & Maintenance Guide

## System Overview
- Chat UI: Port 3100
- Ollama API: Port 11434
- MongoDB: Port 27017

## Common Operations

### Starting Services
```bash
make start
```

### Stopping Services
```bash
make stop
```

### Model Management
```bash
# Install model
make install

# Verify model
docker exec -it qi-ollama ollama list
```

### Log Management
```bash
# View all logs
make logs

# View specific service logs
docker logs qi-chat-ui
docker logs qi-ollama
docker logs qi-mongodb
```

## Backup Procedures

### MongoDB Backup
```bash
# Backup
docker exec qi-mongodb mongodump --out /data/backup/

# Restore
docker exec qi-mongodb mongorestore /data/backup/
```

### Model Backup
```bash
# Backup Ollama models
tar -czf ollama_backup.tar.gz ./ollama
```

## Monitoring

### Health Checks
```bash
# Check service status
make status

# Check individual endpoints
curl http://localhost:11434/api/health
curl http://localhost:3100/health
```

### Resource Usage
```bash
# Monitor container resources
docker stats qi-chat-ui qi-ollama qi-mongodb
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
```bash
# Check logs
docker logs qi-mongodb

# Verify credentials
docker exec -it qi-mongodb mongosh --eval "db.auth('$MONGO_ROOT_USER', '$MONGO_ROOT_PASSWORD')"
```

2. **Ollama Model Issues**
```bash
# Reinstall model
make install

# Clear model cache
docker exec -it qi-ollama rm -rf /root/.ollama/models
```

3. **Chat UI Issues**
```bash
# Check environment
docker exec qi-chat-ui env

# Restart service
docker restart qi-chat-ui
```

## Maintenance Schedule

1. **Daily**
   - Check service status
   - Monitor resource usage
   - Review logs

2. **Weekly**
   - Backup MongoDB data
   - Check for model updates
   - Clean unused Docker resources

3. **Monthly**
   - Full system backup
   - Performance review
   - Security updates

## Security Guidelines

1. **Access Control**
   - Change default passwords
   - Restrict port access
   - Use secure connections

2. **Updates**
   - Keep Docker images updated
   - Monitor security advisories
   - Update models regularly

## Emergency Procedures

### Quick Recovery
```bash
# Stop all services
make stop

# Clean volumes
make clean

# Start fresh
make start
make install
```

### Data Recovery
```bash
# Restore MongoDB
docker cp backup.dump qi-mongodb:/tmp/
docker exec qi-mongodb mongorestore /tmp/backup.dump

# Restore models
docker cp models.tar qi-ollama:/root/.ollama/
```

## Contact

For support:
- GitHub Issues: [repository-url]/issues
- Email: [support-email]
- Documentation: [docs-url]

## License

MIT License