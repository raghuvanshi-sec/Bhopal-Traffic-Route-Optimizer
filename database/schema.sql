CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE road_segments (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, source_node BIGINT NOT NULL, target_node BIGINT NOT NULL, geometry GEOMETRY(LineString, 4326) NOT NULL, distance_meters NUMERIC NOT NULL, speed_limit_kph SMALLINT NOT NULL, road_class TEXT NOT NULL);
CREATE INDEX road_segments_geometry_idx ON road_segments USING GIST (geometry);

CREATE TABLE traffic_observations (observed_at TIMESTAMPTZ NOT NULL, segment_id BIGINT NOT NULL REFERENCES road_segments(id), vehicle_count INTEGER NOT NULL, mean_speed_kph NUMERIC NOT NULL, congestion_index NUMERIC NOT NULL CHECK (congestion_index BETWEEN 0 AND 1), source TEXT NOT NULL, PRIMARY KEY (observed_at, segment_id));
SELECT create_hypertable('traffic_observations', by_range('observed_at'), if_not_exists => TRUE);

CREATE TABLE junctions (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, location GEOMETRY(Point, 4326) NOT NULL, adaptive_enabled BOOLEAN NOT NULL DEFAULT FALSE, current_cycle_seconds SMALLINT NOT NULL DEFAULT 90);
CREATE INDEX junctions_location_idx ON junctions USING GIST (location);

CREATE TABLE signal_recommendations (id BIGSERIAL PRIMARY KEY, junction_id BIGINT NOT NULL REFERENCES junctions(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), predicted_queue_meters NUMERIC NOT NULL, current_cycle_seconds SMALLINT NOT NULL, recommended_cycle_seconds SMALLINT NOT NULL, model_version TEXT NOT NULL, accepted_at TIMESTAMPTZ);

CREATE TABLE emergency_corridors (id UUID PRIMARY KEY, vehicle_id TEXT NOT NULL, origin GEOMETRY(Point, 4326) NOT NULL, destination GEOMETRY(Point, 4326) NOT NULL, route GEOMETRY(LineString, 4326), status TEXT NOT NULL CHECK(status IN ('requested','active','completed','cancelled')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
