import React from 'react';
import { ListView, Item, Button } from '@adobe/react-spectrum';

// Define interfaces
interface Expression {
	id: string;
	name: string;
}

interface ExpressionListProps {
	expressions: Expression[];
	onSelect: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}

// Component with type definitions
const ExpressionList: React.FC<ExpressionListProps> = ({ expressions, onSelect, onEdit, onDelete }) => {
	return (
		<ListView aria-label="Saved Expressions" selectionMode="single" onSelectionChange={(key) => onSelect(key as string)}>
			{expressions.map((expr) => (
				<Item key={expr.id} textValue={expr.name}>
					{expr.name}
					<Button variant="primary" onPress={() => onEdit(expr.id)}>
						Edit
					</Button>
					<Button variant="negative" onPress={() => onDelete(expr.id)}>
						Delete
					</Button>
				</Item>
			))}
		</ListView>
	);
};

export default ExpressionList;
