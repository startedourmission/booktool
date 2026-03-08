import { IconType } from "react-icons";

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <Icon className="mx-auto text-4xl text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
