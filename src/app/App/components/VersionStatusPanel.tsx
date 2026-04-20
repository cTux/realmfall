import { VersionStatusWidget } from '../../../ui/components/VersionStatusWidget/VersionStatusWidget';
import { useVersionStatus } from '../hooks/useVersionStatus';

interface VersionStatusPanelProps {
  onRefresh: () => void;
}

export function VersionStatusPanel({ onRefresh }: VersionStatusPanelProps) {
  const versionStatus = useVersionStatus();

  return (
    <VersionStatusWidget
      currentVersion={versionStatus.currentVersion}
      remoteVersion={versionStatus.remoteVersion}
      status={versionStatus.status}
      onRefresh={onRefresh}
    />
  );
}
