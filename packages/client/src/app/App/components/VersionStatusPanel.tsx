import { VersionStatusWidget } from '../../../ui/components/VersionStatusWidget/VersionStatusWidget';
import { useVersionStatus } from '../hooks/useVersionStatus';
import type { WindowDetailTooltipHandlers } from '../../../ui/components/windowTooltipTypes';

interface VersionStatusPanelProps {
  onRefresh: () => void;
  onHoverDetail?: WindowDetailTooltipHandlers['onHoverDetail'];
  onLeaveDetail?: WindowDetailTooltipHandlers['onLeaveDetail'];
}

export function VersionStatusPanel({
  onRefresh,
  onHoverDetail,
  onLeaveDetail,
}: VersionStatusPanelProps) {
  const versionStatus = useVersionStatus();

  return (
    <VersionStatusWidget
      currentVersion={versionStatus.currentVersion}
      remoteVersion={versionStatus.remoteVersion}
      status={versionStatus.status}
      onRefresh={onRefresh}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    />
  );
}
