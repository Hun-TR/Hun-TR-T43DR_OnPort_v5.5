#ifndef UART_HANDLER_H
#define UART_HANDLER_H

#include <Arduino.h>

// Global değişkenler
extern bool uartHealthy;
extern String lastResponse;

// UART İstatistikleri yapısı (basitleştirilmiş)
struct UARTStatistics {
    unsigned long totalFramesSent;
    unsigned long totalFramesReceived;
    unsigned long frameErrors;
    unsigned long checksumErrors;
    unsigned long timeoutErrors;
    float successRate;
};

extern UARTStatistics uartStats;

// Fonksiyon tanımlamaları
void initUART();
bool changeBaudRate(long newBaudRate);
bool sendBaudRateCommand(long baudRate); // dsPIC33EP için
bool requestFirstFault();
bool requestNextFault();
String getLastFaultResponse();

// Yardımcı fonksiyonlar
void checkUARTHealth();
String safeReadUARTResponse(unsigned long timeout);
void updateUARTStats(bool success);
String getUARTStatus();
bool sendCustomCommand(const String& command, String& response, unsigned long timeout = 0);
bool testUARTConnection();

#endif