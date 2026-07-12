# RCA/backend/src/config/logging_config.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ddm")

# end of RCA/backend/src/config/logging_config.py