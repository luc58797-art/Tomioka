package com.tomioka.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    private WebView webView;

    private static final String VERSION_URL =
        "https://raw.githubusercontent.com/luc58797-art/Tomioka/main/update/version.json";

    private static final String CURRENT_VERSION = "1.1.0";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);

        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        hideSystemUI();

        webView = new WebView(this);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.setBackgroundColor(0xFF000000);

        setContentView(webView);

        webView.loadUrl("file:///android_asset/index.html");

        checkForUpdate();
    }

    private void hideSystemUI() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    private void checkForUpdate() {
        new Thread(() -> {

            HttpURLConnection connection = null;

            try {
                URL url = new URL(VERSION_URL);

                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(8000);
                connection.setReadTimeout(8000);
                connection.setRequestProperty("Cache-Control", "no-cache");

                InputStream input = connection.getInputStream();

                ByteArrayOutputStream buffer =
                    new ByteArrayOutputStream();

                byte[] data = new byte[4096];
                int length;

                while ((length = input.read(data)) != -1) {
                    buffer.write(data, 0, length);
                }

                input.close();

                String jsonText = buffer.toString("UTF-8");

                JSONObject json = new JSONObject(jsonText);

                String latestVersion = json.getString("version");
                String apkUrl = json.getString("apk");

                StringBuilder changelogBuilder = new StringBuilder();

                if (json.has("changelog")) {
                    JSONArray changes = json.getJSONArray("changelog");

                    for (int i = 0; i < changes.length(); i++) {
                        changelogBuilder
                            .append("• ")
                            .append(changes.getString(i))
                            .append("\n");
                    }
                }

                String changelog = changelogBuilder.toString();

                if (isNewerVersion(latestVersion, CURRENT_VERSION)) {

                    final String finalVersion = latestVersion;
                    final String finalApkUrl = apkUrl;
                    final String finalChangelog = changelog;

                    runOnUiThread(() ->
                        showUpdateDialog(
                            finalVersion,
                            finalApkUrl,
                            finalChangelog
                        )
                    );
                }

            } catch (Exception ignored) {

            } finally {

                if (connection != null) {
                    connection.disconnect();
                }
            }

        }).start();
    }

    private boolean isNewerVersion(String latest, String current) {
        try {
            String[] a = latest.split("\\.");
            String[] b = current.split("\\.");

            int max = Math.max(a.length, b.length);

            for (int i = 0; i < max; i++) {

                int av = i < a.length
                    ? Integer.parseInt(a[i])
                    : 0;

                int bv = i < b.length
                    ? Integer.parseInt(b[i])
                    : 0;

                if (av > bv) return true;
                if (av < bv) return false;
            }

        } catch (Exception ignored) {
        }

        return false;
    }

    private void showUpdateDialog(
        String version,
        String apkUrl,
        String changelog
    ) {

        String message =
            "Uma nova versão do Tomioka está disponível!\n\n" +
            "Versão atual: " + CURRENT_VERSION + "\n" +
            "Nova versão: " + version + "\n\n" +
            "Alterações:\n" +
            (changelog.isEmpty()
                ? "• Melhorias e correções"
                : changelog);

        new AlertDialog.Builder(this)
            .setTitle("🌊 Atualização disponível")
            .setMessage(message)
            .setNegativeButton("Agora não", null)
            .setPositiveButton("ATUALIZAR", (dialog, which) -> {
                downloadApk(apkUrl);
            })
            .setCancelable(false)
            .show();
    }

    private void downloadApk(String apkUrl) {

        new Thread(() -> {

            HttpURLConnection connection = null;

            try {

                URL url = new URL(apkUrl);

                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.connect();

                if (connection.getResponseCode()
                        != HttpURLConnection.HTTP_OK) {
                    throw new Exception(
                        "HTTP " + connection.getResponseCode()
                    );
                }

                File updateDir =
                    new File(getCacheDir(), "updates");

                if (!updateDir.exists()) {
                    updateDir.mkdirs();
                }

                File apkFile =
                    new File(updateDir, "Tomioka-update.apk");

                InputStream input = connection.getInputStream();

                FileOutputStream output =
                    new FileOutputStream(apkFile);

                byte[] buffer = new byte[8192];
                int length;

                while ((length = input.read(buffer)) != -1) {
                    output.write(buffer, 0, length);
                }

                output.flush();
                output.close();
                input.close();

                runOnUiThread(() -> installApk(apkFile));

            } catch (Exception e) {

                runOnUiThread(() ->
                    new AlertDialog.Builder(this)
                        .setTitle("Erro na atualização")
                        .setMessage(
                            "Não foi possível baixar a atualização.\n\n" +
                            e.getMessage()
                        )
                        .setPositiveButton("OK", null)
                        .show()
                );

            } finally {

                if (connection != null) {
                    connection.disconnect();
                }
            }

        }).start();
    }

    private void installApk(File apkFile) {

        try {

            Uri apkUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);

            intent.setDataAndType(
                apkUri,
                "application/vnd.android.package-archive"
            );

            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            startActivity(intent);

        } catch (Exception e) {

            new AlertDialog.Builder(this)
                .setTitle("Não foi possível instalar")
                .setMessage(
                    "O APK foi baixado, mas o Android bloqueou " +
                    "a abertura do instalador.\n\n" +
                    e.getMessage()
                )
                .setPositiveButton("OK", null)
                .show();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);

        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public void onBackPressed() {

        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {

        if (webView != null) {
            webView.destroy();
        }

        super.onDestroy();
    }
}
