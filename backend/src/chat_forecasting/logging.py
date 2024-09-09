import logging
import os

def configure_logging(level=logging.INFO, log_file=None):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()  # This will log to console
        ]
    )
    
    # If a log file is specified, add a file handler
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        logging.getLogger().addHandler(file_handler)

def get_logger(name):
    return logging.getLogger(name)