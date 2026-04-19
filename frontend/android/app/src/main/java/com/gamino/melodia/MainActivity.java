package com.gamino.melodia;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Registrar plugins ANTES del super.onCreate
        registerPlugin(com.capacitorjs.plugins.statusbar.StatusBarPlugin.class);
        registerPlugin(com.capacitorjs.plugins.splashscreen.SplashScreenPlugin.class);
        registerPlugin(com.capacitorjs.plugins.keyboard.KeyboardPlugin.class);

        super.onCreate(savedInstanceState);

        // ── EDGE TO EDGE — ocultar barras del sistema visualmente ──
        // La app se dibuja DETRÁS de la status bar y navigation bar
        // El CSS safe-area-inset-top/bottom maneja el padding correcto
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );

        // StatusBar y NavigationBar completamente transparentes
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        // Iconos de la status bar en BLANCO (para fondo negro)
        View decorView = getWindow().getDecorView();
        int flags = decorView.getSystemUiVisibility();
        // Quitar flag de iconos oscuros (queremos iconos blancos)
        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        decorView.setSystemUiVisibility(flags);
    }
}