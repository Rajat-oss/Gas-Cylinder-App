import React from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle
} from 'react-native';
import { Colors } from '../constants/Colors';

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    size?: 'sm' | 'md' | 'lg';
}

export const CustomButton: React.FC<CustomButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    size = 'md'
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'secondary':
                return { bg: Colors.secondary, text: '#ffffff' };
            case 'danger':
                return { bg: Colors.danger, text: '#ffffff' };
            case 'success':
                return { bg: Colors.success, text: '#ffffff' };
            case 'outline':
                return { bg: 'transparent', text: Colors.primary, border: Colors.primary };
            default:
                return { bg: Colors.primary, text: '#ffffff' };
        }
    };

    const config = getVariantStyle();
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: config.bg,
                    borderColor: config.border || 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0,
                    opacity: isDisabled ? 0.6 : 1,
                    paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
                },
                style
            ]}
            onPress={onPress}
            disabled={isDisabled}
        >
            {loading ? (
                <ActivityIndicator color={config.text} size="small" />
            ) : (
                <Text style={[
                    styles.text,
                    {
                        color: config.text,
                        fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
                    },
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    text: {
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
