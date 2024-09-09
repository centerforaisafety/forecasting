# Use Ubuntu 24.04 as the base image
FROM ubuntu:24.04

# Set a non-root user for better security
ARG USERNAME=dockeruser
RUN useradd -ms /bin/bash $USERNAME

# Update and install dependencies in a single RUN command to reduce image layers
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        python3 \
        python3-pip \
        python3-venv \
        git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the application source code
COPY . .

# Create and activate the virtual environment, then install requirements
RUN python3 -m venv /venv && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

# Change ownership of the application files to the non-root user
RUN chown -R $USERNAME:$USERNAME /app

# Switch to the non-root user
USER $USERNAME

# Expose the port the app runs on
EXPOSE 8089

# Command to run the app
CMD ["/venv/bin/python3", "fast_api.py"]
