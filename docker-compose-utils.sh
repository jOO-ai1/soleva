#!/bin/bash

# Docker Compose File Detection Utilities
# This file contains functions to automatically detect and handle Docker Compose files

# Function to detect Docker Compose file name
detect_docker_compose_file() {
    local project_dir="${1:-.}"
    
    # List of possible Docker Compose file names in order of preference
    local possible_files=(
        "docker-compose.yml"
        "docker-compose.yaml"
        "docker compose.yml"
        "docker compose.yaml"
        "compose.yml"
        "compose.yaml"
    )
    
    # Check each possible file
    for file in "${possible_files[@]}"; do
        if [ -f "$project_dir/$file" ]; then
            echo "$file"
            return 0
        fi
    done
    
    # If no file found, return error
    return 1
}

# Function to detect production Docker Compose file name
detect_docker_compose_prod_file() {
    local project_dir="${1:-.}"
    
    # List of possible production Docker Compose file names in order of preference
    local possible_files=(
        "docker-compose.prod.yml"
        "docker-compose.production.yml"
        "docker-compose.prod.yaml"
        "docker-compose.production.yaml"
        "docker compose.prod.yml"
        "docker compose.production.yml"
        "docker compose.prod.yaml"
        "docker compose.production.yaml"
        "compose.prod.yml"
        "compose.production.yml"
        "compose.prod.yaml"
        "compose.production.yaml"
    )
    
    # Check each possible file
    for file in "${possible_files[@]}"; do
        if [ -f "$project_dir/$file" ]; then
            echo "$file"
            return 0
        fi
    done
    
    # If no production file found, return error
    return 1
}

# Function to get Docker Compose command with detected file
get_docker_compose_cmd() {
    local file="${1:-}"
    local project_dir="${2:-.}"
    
    if [ -n "$file" ]; then
        echo "docker compose -f $file"
    else
        local detected_file
        if detected_file=$(detect_docker_compose_file "$project_dir"); then
            echo "docker compose -f $detected_file"
        else
            echo "docker compose"
        fi
    fi
}

# Function to get production Docker Compose command with detected file
get_docker_compose_prod_cmd() {
    local project_dir="${1:-.}"
    
    local detected_file
    if detected_file=$(detect_docker_compose_prod_file "$project_dir"); then
        echo "docker compose -f $detected_file"
    else
        echo "docker compose"
    fi
}

# Function to validate Docker Compose files exist
validate_docker_compose_files() {
    local project_dir="${1:-.}"
    local errors=0
    
    # Check for main Docker Compose file
    if ! detect_docker_compose_file "$project_dir" >/dev/null 2>&1; then
        echo "ERROR: No Docker Compose file found in $project_dir"
        echo "Expected one of: docker-compose.yml, docker-compose.yaml, docker compose.yml, docker compose.yaml"
        errors=$((errors + 1))
    fi
    
    # Check for production Docker Compose file (optional)
    if ! detect_docker_compose_prod_file "$project_dir" >/dev/null 2>&1; then
        echo "WARNING: No production Docker Compose file found in $project_dir"
        echo "This is optional but recommended for production deployments"
    fi
    
    return $errors
}

# Function to create symlink if needed
create_docker_compose_symlink() {
    local project_dir="${1:-.}"
    local target_file="${2:-docker-compose.yml}"
    
    # Check if target file already exists
    if [ -f "$project_dir/$target_file" ]; then
        return 0
    fi
    
    # Try to find an existing file to symlink
    local existing_file
    if existing_file=$(detect_docker_compose_file "$project_dir"); then
        echo "Creating symlink: $target_file -> $existing_file"
        ln -sf "$existing_file" "$project_dir/$target_file"
        return 0
    fi
    
    return 1
}

# Export functions for use in other scripts
export -f detect_docker_compose_file
export -f detect_docker_compose_prod_file
export -f get_docker_compose_cmd
export -f get_docker_compose_prod_cmd
export -f validate_docker_compose_files
export -f create_docker_compose_symlink
