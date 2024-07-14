import React, { useState } from 'react';
import { TextField, TextArea, Button, Flex } from '@adobe/react-spectrum';

interface Expression {
	id: string;
	name: string;
	code: string;
	notes?: string;
}

interface ExpressionEditorProps {
	expression: Expression;
	onSave: (expression: Expression) => void;
	onCancel: () => void;
}

const ExpressionEditor: React.FC<ExpressionEditorProps> = ({ expression, onSave, onCancel }) => {
	const [name, setName] = useState(expression.name);
	const [code, setCode] = useState(expression.code);
	const [notes, setNotes] = useState(expression.notes || '');

	return (
		<Flex direction="column" gap="size-100">
			<TextField label="Name" value={name} onChange={setName} />
			<TextArea label="Expression Code" value={code} onChange={setCode} />
			<TextArea label="Notes" value={notes} onChange={setNotes} />
			<Flex gap="size-100">
				<Button variant="cta" onPress={() => onSave({ ...expression, name, code, notes })}>
					Save
				</Button>
				<Button variant="secondary" onPress={onCancel}>
					Cancel
				</Button>
			</Flex>
		</Flex>
	);
};

export default ExpressionEditor;
