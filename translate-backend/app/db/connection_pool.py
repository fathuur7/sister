"""
Database Connection Pool Manager
Handles master-slave PostgreSQL connections with automatic routing
"""

import os
import random
from typing import Optional
from contextlib import contextmanager
from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker, Session


class DatabaseConnectionPool:
    """
    Manages database connections with master-slave replication
    - WRITE operations → Master
    - READ operations → Slaves (round-robin)
    """
    
    def __init__(self):
        # Master connection (for writes)
        self.master_host = os.getenv('POSTGRES_MASTER_HOST', 'localhost')
        self.master_port = os.getenv('POSTGRES_MASTER_PORT', '5432')
        
        # Slave connections (for reads)
        slave_hosts_str = os.getenv('POSTGRES_SLAVE_HOSTS', '')
        self.slave_hosts = [h.strip() for h in slave_hosts_str.split(',') if h.strip()]
        
        # Database credentials
        self.db_user = os.getenv('POSTGRES_USER', 'postgres')
        self.db_password = os.getenv('POSTGRES_PASSWORD', 'postgres')
        self.db_name = os.getenv('POSTGRES_DB', 'transvidio')
        
        # Create engines
        self.master_engine = self._create_engine(self.master_host, self.master_port)
        self.slave_engines = [
            self._create_engine(host, '5432') for host in self.slave_hosts
        ] if self.slave_hosts else [self.master_engine]
        
        # Session factories
        self.MasterSession = sessionmaker(bind=self.master_engine)
        
        print(f"✅ Database pool initialized:")
        print(f"   Master: {self.master_host}:{self.master_port}")
        print(f"   Slaves: {len(self.slave_engines)} nodes")
    
    def _create_engine(self, host: str, port: str):
        """Create SQLAlchemy engine with connection pooling"""
        connection_string = (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{host}:{port}/{self.db_name}"
        )
        
        return create_engine(
            connection_string,
            poolclass=pool.QueuePool,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=3600,   # Recycle connections after 1 hour
            echo=False
        )
    
    @contextmanager
    def get_master_session(self) -> Session:
        """
        Get master database session for WRITE operations
        
        Usage:
            with db_pool.get_master_session() as session:
                session.add(new_record)
                session.commit()
        """
        session = self.MasterSession()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    @contextmanager
    def get_slave_session(self) -> Session:
        """
        Get slave database session for READ operations
        Uses round-robin across available slaves
        
        Usage:
            with db_pool.get_slave_session() as session:
                results = session.query(Video).all()
        """
        # Pick random slave for load distribution
        slave_engine = random.choice(self.slave_engines)
        SlaveSession = sessionmaker(bind=slave_engine)
        
        session = SlaveSession()
        try:
            yield session
        finally:
            session.close()
    
    def health_check(self) -> dict:
        """Check health of all database connections"""
        status = {
            'master': self._check_connection(self.master_engine),
            'slaves': []
        }
        
        for i, engine in enumerate(self.slave_engines):
            status['slaves'].append({
                'index': i,
                'healthy': self._check_connection(engine)
            })
        
        return status
    
    def _check_connection(self, engine) -> bool:
        """Test database connection"""
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            return True
        except Exception as e:
            print(f"Database connection error: {e}")
            return False


# Global connection pool instance
db_pool = DatabaseConnectionPool()
