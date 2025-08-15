import serial
import datetime

# micro:bitが接続されているCOMポート番号をデバイスマネージャーで確認して設定
# (例: 'COM3', 'COM4'など)
COM_PORT = 'COM3'  # ★★★ 環境に合わせて必ず変更してください ★★★
BAUD_RATE = 115200 # micro:bit側で設定した値と合わせる
LOG_FILE_PATH = 'microbit_serial_log.csv'

try:
    # シリアルポートに接続
    ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=0.1)
    print(f"{COM_PORT}に接続しました。データ受信を開始します。")

    with open(LOG_FILE_PATH, 'a', encoding='utf-8') as f:
        while True:
            # micro:bitから1行分のデータを読み込む
            line = ser.readline()

            if line:
                # 受信データはバイト列なので、文字列にデコードして前後の空白を削除
                try:
                    data_str = line.decode('utf-8').strip()
                    
                    # 現在時刻を取得
                    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    # ログのエントリーを作成
                    log_entry = f'{timestamp},{data_str}'
                    
                    # コンソールに表示
                    print(log_entry)
                    
                    # ファイルに書き込む
                    f.write(log_entry + '\n')
                    f.flush() # 即座にファイルに書き出す

                except UnicodeDecodeError:
                    print("デコードエラーが発生しました。")
                    
except serial.SerialException as e:
    print(f"エラー: {e}")
    print(f"{COM_PORT} が見つからないか、開けません。COMポート番号が正しいか確認してください。")
except KeyboardInterrupt:
    print("\nプログラムを終了します。")
finally:
    if 'ser' in locals() and ser.is_open:
        ser.close()
        print(f"{COM_PORT}を閉じました。")