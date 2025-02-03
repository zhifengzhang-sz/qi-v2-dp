# Operation & Maintenance Guide

## System Overview
- Chat UI: Port 3000
- Ollama API: Port 11434
- MongoDB: Port 27017

## Common Operations

### Service Management

```bash
# Start services (single model)
make start-single

# Start services (multi-model)
make start-multi

# Stop services
make stop

# Clean up (stop & remove volumes)
make clean
```

### Model Management

```bash
# List installed models
make list-models

# Get model information
make model-info

# Pull new model
make pull-model

# View model logs
docker logs qi-ollama
```

### Monitoring

```bash
# View all service logs
make logs

# View individual service logs
docker logs qi-chat-ui
docker logs qi-ollama
docker logs qi-mongodb

# Check container stats
docker stats qi-chat-ui qi-ollama qi-mongodb
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

## Troubleshooting Guide

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   make logs
   
   # Try clean restart
   make clean
   make start-single  # or make start-multi
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   docker logs qi-mongodb
   
   # Verify MongoDB is running
   docker ps | grep qi-mongodb
   
   # Test connection
   docker exec -it qi-mongodb mongosh --eval "db.auth('$MONGO_ROOT_USER', '$MONGO_ROOT_PASSWORD')"
   ```

3. **Model Loading Issues**
   ```bash
   # Check model list
   make list-models
   
   # Check Ollama logs
   docker logs qi-ollama
   
   # Reinstall model
   make pull-model
   ```

4. **Chat UI Issues**
   ```bash
   # Check UI logs
   docker logs qi-chat-ui
   
   # Verify environment
   docker exec qi-chat-ui env
   
   # Restart UI
   docker restart qi-chat-ui
   ```

## Maintenance Schedule

### Daily Tasks
- Monitor service status
- Check logs for errors
- Monitor resource usage

### Weekly Tasks
- Backup MongoDB data
- Update models if needed
- Clean unused Docker resources

### Monthly Tasks
- Full system backup
- Security updates
- Performance review

## Security Guidelines

1. **Access Control**
   - Use strong passwords in .env
   - Restrict port access
   - Keep HF_TOKEN secure

2. **Updates**
   - Keep Docker images updated
   - Monitor for security advisories
   - Update models regularly

## Emergency Recovery

### Quick Recovery
```bash
# Full system reset
make clean
make start-single  # or make start-multi

# Individual service restart
docker restart qi-chat-ui
docker restart qi-ollama
docker restart qi-mongodb
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