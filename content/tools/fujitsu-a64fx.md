---
slug: fujitsu-a64fx
title: Fujitsu A64FX
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: "AI Infrastructure"
price_model: Individuelles Angebot
official_url: "https://global.fujitsu/en-global/capabilities/computer-platform"
description: "Arm-basierter HPC-Prozessor mit SVE und integriertem HBM2 für speicherintensive wissenschaftliche Berechnungen und große Cluster."
updated_at: 2026-07-13
lastReviewed: 2026-07-13
popularity: 0
tier: "C"
generated_at: "2026-05-15"
---
# Fujitsu A64FX

Der Fujitsu A64FX ist ein spezialisierter Arm-Prozessor für High Performance Computing: Er verbindet viele Rechenkerne, Scalable Vector Extension (SVE) und integrierten HBM2-Speicher in einem CPU-Sockel. Das macht ihn interessant für wissenschaftliche Simulationen, numerische Modelle und andere datenintensive HPC-Programme, aber nicht zu einem universellen Desktop-Prozessor, fertigen Cloud-Dienst oder automatisch schnelleren Ersatz für jede x86-Anwendung.

## Was ist der A64FX und für wen passt er?

Der Chip richtet sich an Rechenzentren, Forschungseinrichtungen und Teams, die eigene HPC-Knoten oder einen darauf basierenden Cluster planen. Fujitsu nennt Armv8.2-A mit SVE, 48 Rechenkernen und bis zu vier zusätzlichen Assistenzkernen. Vier HBM2-Stacks liefern zusammen 32 GiB Speicher und eine sehr hohe Speicherbandbreite; das ist besonders relevant, wenn ein Programm regelmäßig auf große Datenmengen zugreift und nicht nur rohe Rechenleistung benötigt.

Für ein Team mit einer bestehenden, gut getesteten x86- oder GPU-Pipeline ist der A64FX deshalb kein Drop-in-Kauf. Die Entscheidung beginnt mit einem Portierungs- und Benchmarking-Projekt: Quellcode, Compiler, MPI/OpenMP-Stack, Bibliotheken und Container müssen auf Arm und die konkrete Systemumgebung abgestimmt werden.

## Die wichtigen Komponenten im Arbeitsprozess

- **CPU und SVE:** Vektorisierbare Schleifen können mehrere Datenpunkte pro Instruktion bearbeiten. Der Gewinn hängt vom Compiler, Datenlayout und tatsächlichen Algorithmus ab, nicht allein vom Vorhandensein von SVE.
- **HBM2:** Der lokal integrierte Speicher reduziert bei passenden Workloads den Weg zu den Daten. 32 GiB pro Prozessor sind zugleich eine klare Kapazitätsgrenze: Größere Datensätze müssen über mehrere Knoten, Speicherstufen oder I/O verarbeitet werden.
- **Knoten- und Clusterkommunikation:** Für verteilte Programme zählen MPI, Prozessplatzierung und das Interconnect-Design des gewählten Systems. Der Prozessor allein liefert keine Clusterstrategie.
- **Arm-Software-Stack:** Compiler, math libraries, MPI, Scheduler und Monitoring müssen als reproduzierbarer Stack versioniert werden. Fujitsu dokumentiert dafür unter anderem Arm-spezifische Compiler- und HPC-Umgebungen.

## Praktischer Einführungs-Workflow

Beginne nicht mit einem synthetischen Peak-Wert, sondern mit einem repräsentativen Job: etwa einer Wetter-, Strömungs-, Material- oder Molekülsimulation mit realer Eingabegröße. Miss zunächst die bestehende Referenz auf der aktuellen Plattform. Danach portiert das Team eine kleine, reproduzierbare Teilstrecke auf A64FX und dokumentiert Compilerflags, Threadzahl, MPI-Ranks, Speicherbedarf, Laufzeit und Ergebnisabweichung.

Ein sinnvoller Pilot hat drei Stufen: erst kompiliert und validiert man den seriellen beziehungsweise kleinen Parallelfall, dann skaliert man innerhalb eines Knotens, schließlich über mehrere Knoten. Erst wenn Rechenergebnis, Laufzeit, Energie- oder Clusterkosten und Wartungsaufwand gemeinsam besser aussehen, ist ein Rollout begründet. Ein reproduzierbares Container- oder Modul-Setup verhindert, dass nur die Umgebung einer einzelnen Person funktioniert.

## Betrieb, Integration und Wartung

In Produktion gehören Scheduler, Job-Queues, Node-Health, MPI-Topologie, HBM-Auslastung, Datei- und Checkpoint-I/O sowie Fehlerwiederanlauf zum Produktivsystem. Für lange Simulationen sollte ein Job regelmäßig Checkpoints schreiben und nach einem Knoten- oder Dateisystemfehler kontrolliert fortsetzen können. Das reduziert die Kosten eines fehlgeschlagenen Laufs stärker als ein isolierter Mikrobenchmark.

Die Systemform ist entscheidend: A64FX wird in spezialisierten HPC-Systemen eingesetzt, nicht als austauschbare CPU für einen beliebigen Büroserver. Vor der Beschaffung müssen Kühlung, Rack- und Netzplanung, Ersatzteil- und Supportmodell, Compiler-Lizenzen beziehungsweise Supportverträge und die Verfügbarkeit der benötigten Bibliotheken geklärt werden. Für Cloud-Nutzung ist die konkrete Provider- und Instanzverfügbarkeit zu prüfen; aus dem Prozessornamen folgt kein allgemeines Public-Cloud-Angebot.

## Qualität, Portierung und Messkriterien

Ein schneller Lauf ist nur dann ein Erfolg, wenn die Ergebnisse fachlich identisch oder erklärbar abweichend sind. Lege deshalb Toleranzen, Referenzdaten, deterministische Testfälle und eine Review-Verantwortung fest. Prüfe auch die Skalierung: Ein Programm, das bei einem Knoten gewinnt, kann durch MPI-Kommunikation, I/O oder unausgewogene Partitionierung bei vielen Knoten verlieren.

Die wichtigsten Entscheidungssignale sind reale Zeit bis zum Ergebnis, Speicherbandbreite im Workload, Parallelskalierung, Auslastung, Energie- und Infrastrukturkosten sowie der Aufwand für Portierung und Betrieb. KI-Anteile wie Vektor-, Halbpräzisions- oder Integer-Dot-Product-Berechnungen können profitieren; daraus sollte man jedoch keine GPU- oder dedizierte AI-Accelerator-Leistung ableiten.

## Sicherheit, Daten und Governance

Der A64FX ist Hardware, kein SaaS-Dienst, der automatisch Datenverarbeitung, Aufbewahrung oder Zugriff regelt. Schutzmaßnahmen liegen in der HPC-Umgebung: getrennte Accounts und Projekte, Scheduler-Berechtigungen, Netzwerksegmentierung, sichere Images und Module, Patch- und Firmware-Prozesse, verschlüsselte beziehungsweise kontrollierte Dateisysteme und eine dokumentierte Lösch- und Aufbewahrungsregel.

Bei Forschungs- oder Kundendaten müssen Datenklassifizierung, Exportregeln, Standort des Rechenzentrums, Backups und Zugriffsprotokolle vor dem ersten produktiven Job geklärt sein. Ergebnisse aus Simulationen brauchen außerdem eine Herkunftskette: Version von Code, Compiler, Eingabedaten, Parametern und Checkpoint. Das ist für wissenschaftliche Reproduzierbarkeit ebenso wichtig wie für interne Freigaben.

## Preis und reale Kosten

Für den A64FX gibt es in dieser Kartenperspektive keinen verlässlichen Einzelhandelspreis. Die Kosten entstehen typischerweise über ein System- oder Clusterangebot: Knoten und Speicher, Netz und Rack, Kühlung, Installation, Support, Softwareumgebung, Strom, Speicher- und Backup-Infrastruktur sowie die Portierung vorhandener Anwendungen. Ein Vergleich nur nach CPU-Preis wäre daher irreführend.

Bitte fordere ein Angebot für die konkrete Knotenzahl und den geplanten Workload an. In den Vergleich gehören nicht nur Anschaffung und Lieferumfang, sondern auch Kosten pro abgeschlossenem Job, Wartungsfenster, Ausfallwiederanlauf und die Zeit der Entwickler für Arm-Optimierung.

## Redaktionelle Einschätzung

Der A64FX empfiehlt sich für HPC-Teams mit einem klaren, parallelisierbaren und speicherbandbreitenintensiven Workload, eigener Betriebsverantwortung und Bereitschaft zur Arm-Portierung. Wert entsteht, wenn ein repräsentativer Job messbar schneller, effizienter oder wirtschaftlicher abgeschlossen wird und der Stack reproduzierbar betreibbar ist.

Für kleine Teams ohne HPC-Betrieb, für gewöhnliche Server-Software oder für AI-Projekte, die primär von CUDA-Ökosystem und GPU-Tensorbeschleunigung leben, ist eine spezialisierte CPU-Alternative oft die bessere Entscheidung. Der A64FX sollte über reale End-to-End-Ergebnisse gewählt werden, nicht über Marketing-Peakwerte.

<figure class="tool-editorial-figure">
  <img src="/images/tools/fujitsu-a64fx-editorial.webp" alt="HPC-Knoten mit dicht gepacktem Prozessor- und Speichermodul in einem wissenschaftlichen Rechenzentrum" loading="lazy" decoding="async" />
</figure>

## Alternativen

- [NVIDIA A100 Tensor Core GPU](/tools/nvidia-a100-tensor-core-gpu/): Sinnvoller, wenn Training und Inferenz mit GPU-optimierten Frameworks und Tensor Cores im Mittelpunkt stehen.
- [AMD Instinct GPU](/tools/amd-instinct-gpu/): Eine GPU-Familie für Teams, die hohe Parallelität und ein alternatives Accelerator-Ökosystem evaluieren wollen.
- [Intel Habana Labs Gaudi](/tools/intel-habana-labs-gaudi/): Passt eher zu dedizierten Deep-Learning-Workloads als zu allgemeinen CPU-HPC-Simulationen.
- [Graphcore IPU](/tools/graphcore-ipu/): Eine stärker spezialisierte Architektur für Graph- und AI-Workloads, mit entsprechend anderer Software- und Portierungsentscheidung.
- [NVIDIA Tensor Core GPUs](/tools/nvidia-tensor-core-gpus/): Eine breitere GPU-Option, wenn viele fertige AI-Frameworks und Modellimplementierungen verfügbar sein sollen.

## FAQ

**Wann ist der A64FX einer GPU vorzuziehen?**

Wenn der Workload als CPU-HPC-Code mit MPI, OpenMP und vektorisierbaren numerischen Schleifen gut abbildbar ist und von hoher Speicherbandbreite profitiert. Für stark tensor- oder GPU-optimiertes Deep Learning sollte ein GPU-Vergleich im selben Pilot zuerst erfolgen.

**Kann ich bestehende x86-Programme unverändert ausführen?**

Nicht zuverlässig. Portierbarkeit hängt von Quellcode, Binärabhängigkeiten, Compiler, Bibliotheken und Containerbasis ab. Plane eine Arm-Validierung und prüfe neben dem Build auch numerische Ergebnisse und Performance.

**Ist der A64FX ein fertiger Cloud-Service?**

Nein. Er ist ein Prozessor, der in spezialisierten Systemen und bestimmten HPC-Angeboten eingesetzt werden kann. Verfügbarkeit, Zugang, Abrechnung und Support müssen beim konkreten System- oder Cloud-Anbieter geprüft werden.

**Wie sollte ein Kauf verglichen werden?**

Vergleiche einen vollständigen, reproduzierbaren Job: Ergebnisqualität, Zeit bis zum Ergebnis, Skalierung, Speicher- und I/O-Verhalten, Energie beziehungsweise Systemkosten und Portierungsaufwand. Ein Peak-FLOPS-Wert allein reicht nicht.
