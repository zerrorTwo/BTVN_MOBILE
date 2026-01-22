import React from 'react';
import { StyleSheet, ViewStyle, View, StatusBar, Platform } from 'react-native';

interface LayoutProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export default function Layout({ children, style }: LayoutProps) {
    return (
        <View style={[styles.container, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
});
