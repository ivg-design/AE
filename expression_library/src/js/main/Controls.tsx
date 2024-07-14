import React from 'react';
import { ButtonGroup, Button } from '@adobe/react-spectrum';

interface ControlsProps {
	onAdd: () => void;
	onApply: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onAdd, onApply }) => {
	return (
		<ButtonGroup>
			<Button variant="cta" onPress={onAdd}>
				Add Expression
			</Button>
			<Button variant="primary" onPress={onApply}>
				Apply Expression
			</Button>
		</ButtonGroup>
	);
};

export default Controls;
